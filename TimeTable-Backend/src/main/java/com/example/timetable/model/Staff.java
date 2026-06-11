package com.example.timetable.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "staff")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Staff {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String code;

    private String designation;
    private String dept;
    private Integer maxHours;
    private Boolean handleLabs;
    private String eligibleSubjects; // Comma-separated subject codes

    // Optional: Reference to Department entity if needed
    // @ManyToOne
    // @JoinColumn(name = "dept_id")
    // private Department department;
}
