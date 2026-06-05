package helper.project.planner_helper.Database;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.GenerationType;
import java.time.Instant;

@Entity
@Table(name = "users")
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, unique = true, nullable = false)
    private UUID id;

    @Column(name = "identity", updatable = false, unique = true, nullable = false)
    private String identity; // The id from keycloak

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private Instant createdDate;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @PrePersist
    protected void onCreate() {
        this.createdDate = Instant.now();
    }

    @ManyToMany(mappedBy = "users")
    private List<GroupEntity> groups = new ArrayList<>();

    @OneToMany(mappedBy = "user")
    private List<TaskEntity> tasks = new ArrayList<>();

    // GETTERS and SETTERS
    public String getIdentity() {
        return this.identity;
    }

    public void setIdentity(String identity) {
        this.identity = identity;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Instant getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(Instant createdDate) {
        this.createdDate = createdDate;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public List<GroupEntity> getGroups() {
        return groups;
    }

    public void addGroup(GroupEntity group) {
        this.groups.add(group);
    }

    public List<TaskEntity> getTasks() {
        return tasks;
    }

    public void addTask(TaskEntity tasks) {
        this.tasks.add(tasks);
    }
}
