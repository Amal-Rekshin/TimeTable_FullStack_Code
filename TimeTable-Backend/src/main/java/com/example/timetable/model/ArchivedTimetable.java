package com.example.timetable.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "archived_timetables")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArchivedTimetable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String dept;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String grid; // JSON representation of the timetable grid

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String staffDetails;

    private String version;

    @CreationTimestamp
    private LocalDateTime archivedAt;

    @PrePersist
    protected void onCreate() {
        if (this.version == null || this.version.isEmpty()) {
            this.version = "v" + java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd_HHmm").format(java.time.LocalDateTime.now());
        }
    }
}
