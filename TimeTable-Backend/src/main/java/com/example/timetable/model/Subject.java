package com.example.timetable.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "subjects")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @JsonAlias("subject")
    private String name;

    private String shortName;

    @Column(nullable = false)
    private String code;

    private String dept;
    private String type;
    private String teacher;
    private String teacherCode;
    private String teacherB;
    private String teacherCodeB;
    private Boolean needsSectionB;
    private Boolean saturdayOnly;
    
    @Column(name = "hours", nullable = false)
    @JsonAlias("hours")
    private Double credits;

    // hoursPerWeek can remain if it's used for something else, 
    // but for generation we will use credits.
    private Double hoursPerWeek;
}
