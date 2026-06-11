package com.example.timetable.controller;

import com.example.timetable.model.Subject;
import com.example.timetable.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectRepository subjectRepository;

    @GetMapping
    public List<Subject> getAll() {
        return subjectRepository.findAll();
    }

    @PostMapping
    public Subject create(@RequestBody Subject subject) {
        return subjectRepository.save(subject);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Subject> update(@PathVariable Long id, @RequestBody Subject subject) {
        return subjectRepository.findById(id)
                .map(existing -> {
                    existing.setName(subject.getName());
                    existing.setCode(subject.getCode());
                    existing.setDept(subject.getDept());
                    existing.setType(subject.getType());
                    existing.setHoursPerWeek(subject.getHoursPerWeek());
                    existing.setCredits(subject.getCredits());
                    return ResponseEntity.ok(subjectRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!subjectRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        subjectRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
