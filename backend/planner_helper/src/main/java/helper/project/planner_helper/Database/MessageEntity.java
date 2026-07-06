package helper.project.planner_helper.Database;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import helper.project.planner_helper.Types.MessageRole;

@Entity
@Table(name = "messages")
public class MessageEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, unique = true, nullable = false)
    private UUID id;

    @Lob // maps to PostgreSQL TEXT — supports long AI responses
    @Column(nullable = false)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageRole role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = true)
    private ConversationEntity conversation;

    // nullable — a message belongs to either a conversation OR a group chat room,
    // not both
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_chat_room_id", nullable = true)
    private GroupChatRoomEntity groupChatRoom;

    @Column(nullable = false)
    private Instant createdDate;

    @PrePersist
    protected void onCreate() {
        this.createdDate = Instant.now();
    }

    // GETTERS and SETTERS
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public MessageRole getRole() {
        return role;
    }

    public void setRole(MessageRole role) {
        this.role = role;
    }

    public ConversationEntity getConversation() {
        return conversation;
    }

    public void setConversation(ConversationEntity conversation) {
        this.conversation = conversation;
    }

    public GroupChatRoomEntity getGroupChatRoom() {
        return groupChatRoom;
    }

    public void setGroupChatRoom(GroupChatRoomEntity groupChatRoom) {
        this.groupChatRoom = groupChatRoom;
    }

    public Instant getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(Instant createdDate) {
        this.createdDate = createdDate;
    }
}
