package com.example.timetable.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "system_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemConfig {
    @Id
    private String configKey;

    @Column(nullable = false)
    private String configValue;
}
