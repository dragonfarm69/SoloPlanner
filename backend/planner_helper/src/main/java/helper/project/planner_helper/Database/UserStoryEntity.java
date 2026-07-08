package helper.project.planner_helper.Database;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import helper.project.planner_helper.Types.Priority;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.DynamicUpdate;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;

@Entity
@DynamicUpdate
@Table(name = "user_story")
public class UserStoryEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, unique = true, nullable = false)
    private UUID id;

    private String title;
    private String description; // extra description of the story

    private String roleContext;
    private String wantContext;
    private String benefitContext;

    @Enumerated(EnumType.STRING)
    private Priority priority = Priority.MEDIUM;

    private String status = "open";

    private Integer storyPoints;

    // link to project
    @ManyToOne(fetch = FetchType.LAZY) // optional: lazy loading is usually best
    @JoinColumn(name = "project_id", nullable = false) // column name in the USER_STORY table
    private ProjectEntity project;

    // link to tasks
    @OneToMany(mappedBy = "userStory", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TaskEntity> tasks;

    // creator of the user story
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    private UserEntity creator;

    // link to epic (optional — a story may not yet be assigned to an epic)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "epic_id")
    private EpicEntity epic;

    // timestamps — auto-managed by Hibernate, no manual Instant.now() needed
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant editedAt;

    // archived flag
    private boolean archived = false;

    // Getters and Setters

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ProjectEntity getProject() {
        return project;
    }

    public void setProject(ProjectEntity project) {
        this.project = project;
    }

    public List<TaskEntity> getTasks() {
        return tasks;
    }

    public void setTasks(List<TaskEntity> tasks) {
        this.tasks = tasks;
    }

    public UserEntity getCreator() {
        return creator;
    }

    public void setCreator(UserEntity creator) {
        this.creator = creator;
    }

    public EpicEntity getEpic() {
        return epic;
    }

    public void setEpic(EpicEntity epic) {
        this.epic = epic;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getEditedAt() {
        return editedAt;
    }

    public void setEditedAt(Instant editedAt) {
        this.editedAt = editedAt;
    }

    public boolean isArchived() {
        return archived;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
    }

    public String getRoleContext() {
        return roleContext;
    }

    public void setRoleContext(String roleContext) {
        this.roleContext = roleContext;
    }

    public String getWantContext() {
        return wantContext;
    }

    public void setWantContext(String wantContext) {
        this.wantContext = wantContext;
    }

    public String getBenefitContext() {
        return benefitContext;
    }

    public void setBenefitContext(String benefitContext) {
        this.benefitContext = benefitContext;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getStoryPoints() {
        return storyPoints;
    }

    public void setStoryPoints(Integer storyPoints) {
        this.storyPoints = storyPoints;
    }

}
