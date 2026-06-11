package com.example.timetable.controller;

import com.example.timetable.model.SystemConfig;
import com.example.timetable.repository.SystemConfigRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/config")
@RequiredArgsConstructor
@CrossOrigin(origins = "https://classtimescheduler.netlify.app")
public class SystemConfigController {

    private final SystemConfigRepository repository;

    @PostConstruct
    public void init() {
        if (!repository.existsById("allowCreditEdit")) {
            repository.save(new SystemConfig("allowCreditEdit", "true"));
        }
    }

    @GetMapping
    public List<SystemConfig> getAllConfigs() {
        return repository.findAll();
    }

    @GetMapping("/{key}")
    public SystemConfig getConfig(@PathVariable String key) {
        return repository.findById(key)
                .orElse(new SystemConfig(key, "false"));
    }

    @PutMapping("/{key}")
    public SystemConfig updateConfig(@PathVariable String key, @RequestBody String value) {
        // Remove quotes if they are sent in the body
        String cleanValue = value.replace("\"", "");
        SystemConfig config = repository.findById(key)
                .orElse(new SystemConfig(key, cleanValue));
        config.setConfigValue(cleanValue);
        return repository.save(config);
    }
}
