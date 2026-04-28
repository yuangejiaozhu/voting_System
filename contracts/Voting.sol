// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@semaphore-protocol/contracts/Semaphore.sol";

/// @title Voting - 匿名投票合约
/// @dev 使用 Semaphore 实现 zk 匿名投票
contract Voting {
    // Semaphore 合约实例
    Semaphore public semaphore;
    
    // 提案结构体
    struct Proposal {
        uint256 id;
        address creator;
        string description;
        string[] options;
        uint256 endTime;
        uint256 groupId;  // 对应的 Semaphore 组 ID
        bool exists;
    }
    
    // 投票记录：proposalId => nullifier => 是否已投票
    mapping(uint256 => mapping(uint256 => bool)) public voted;
    
    // 投票结果：proposalId => optionIndex => 票数
    mapping(uint256 => mapping(uint256 => uint256)) public votes;
    
    // 提案列表
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCounter;
    
    // 事件
    event ProposalCreated(uint256 indexed proposalId, address indexed creator, string description, uint256 endTime);
    event VoterAdded(uint256 indexed proposalId, uint256 indexed groupId, uint256 identityCommitment);
    event VoteCast(uint256 indexed proposalId, uint256 optionIndex, uint256 nullifier);
    
    /// @dev 构造函数，传入 Semaphore 合约地址
    /// @param _semaphore: 已部署的 Semaphore 合约地址
    constructor(address _semaphore) {
        semaphore = Semaphore(_semaphore);
    }
    
    /// @dev 创建新提案
    /// @param _description: 提案描述
    /// @param _options: 投票选项数组
    /// @param _duration: 投票持续时间（秒）
    /// @return proposalId: 新提案 ID
    function createProposal(
        string calldata _description,
        string[] calldata _options,
        uint256 _duration
    ) external returns (uint256) {
        require(_options.length >= 2, "At least 2 options required");
        require(_duration > 0, "Duration must be positive");
        
        uint256 proposalId = proposalCounter++;
        
        // 为这个提案创建 Semaphore 组
        uint256 groupId = semaphore.createGroup(address(this));
        
        // 存储提案
        proposals[proposalId] = Proposal({
            id: proposalId,
            creator: msg.sender,
            description: _description,
            options: _options,
            endTime: block.timestamp + _duration,
            groupId: groupId,
            exists: true
        });
        
        emit ProposalCreated(proposalId, msg.sender, _description, block.timestamp + _duration);
        
        return proposalId;
    }
    
    /// @dev 加入投票组（注册为投票者）
    /// @param _proposalId: 提案 ID
    /// @param _identityCommitment: 投票者的 Semaphore 身份承诺
    function joinProposal(uint256 _proposalId, uint256 _identityCommitment) external {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.exists, "Proposal does not exist");
        require(block.timestamp < proposal.endTime, "Voting has ended");
        
        // 将身份承诺添加到 Semaphore 组
        semaphore.addMember(proposal.groupId, _identityCommitment);
        
        emit VoterAdded(_proposalId, proposal.groupId, _identityCommitment);
    }
    
    /// @dev 投票（使用 zk 证明）
    /// @param _proposalId: 提案 ID
    /// @param _optionIndex: 选择的选项索引（单选）
    /// @param _nullifier: Semaphore 证明中的 nullifier（防止重复投票）
    /// @param _merkleTreeDepth: Merkle 树深度
    /// @param _merkleTreeRoot: Merkle 树根
    /// @param _points: zk 证明点 [a, b, c]
    function castVote(
        uint256 _proposalId,
        uint256 _optionIndex,
        uint256 _nullifier,
        uint256 _merkleTreeDepth,
        uint256 _merkleTreeRoot,
        uint256[8] calldata _points
    ) external {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.exists, "Proposal does not exist");
        require(block.timestamp < proposal.endTime, "Voting has ended");
        require(_optionIndex < proposal.options.length, "Invalid option index");
        require(!voted[_proposalId][_nullifier], "Already voted");
        
        // 构造 Semaphore 证明结构
        ISemaphore.SemaphoreProof memory proof = ISemaphore.SemaphoreProof({
            merkleTreeDepth: _merkleTreeDepth,
            merkleTreeRoot: _merkleTreeRoot,
            nullifier: _nullifier,
            message: _optionIndex,  // 投票选项作为 message
            scope: _proposalId,     // 提案 ID 作为 scope（防止跨提案重用证明）
            points: _points
        });
        
        // 验证 zk 证明
        require(semaphore.verifyProof(proposal.groupId, proof), "Invalid proof");
        
        // 标记已投票
        voted[_proposalId][_nullifier] = true;
        
        // 记录投票
        votes[_proposalId][_optionIndex]++;
        
        emit VoteCast(_proposalId, _optionIndex, _nullifier);
    }
    
    /// @dev 获取提案信息
    function getProposal(uint256 _proposalId) external view returns (
        uint256 id,
        address creator,
        string memory description,
        string[] memory options,
        uint256 endTime,
        uint256 groupId,
        uint256 voteCount
    ) {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.exists, "Proposal does not exist");
        
        // 计算总票数
        uint256 totalVotes = 0;
        for (uint256 i = 0; i < proposal.options.length; i++) {
            totalVotes += votes[_proposalId][i];
        }
        
        return (
            proposal.id,
            proposal.creator,
            proposal.description,
            proposal.options,
            proposal.endTime,
            proposal.groupId,
            totalVotes
        );
    }
    
    /// @dev 获取某选项的票数
    function getVotes(uint256 _proposalId, uint256 _optionIndex) external view returns (uint256) {
        return votes[_proposalId][_optionIndex];
    }
}
