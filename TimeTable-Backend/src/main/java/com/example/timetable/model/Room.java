package com.example.timetable.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private Integer capacity;
    private Integer benches;
    private String type;
    private String block;
    private String floor;
    private String status;
    private String maintenanceDate;
    private String amenities;
}
