package com.example.timetable.controller;

import com.example.timetable.model.ArchivedTimetable;
import com.example.timetable.model.Subject;
import com.example.timetable.repository.ArchivedTimetableRepository;
import com.example.timetable.service.TimetableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/timetable")
@RequiredArgsConstructor
public class TimetableController {

    private final TimetableService timetableService;
    private final ArchivedTimetableRepository archivedTimetableRepository;

    @PostMapping("/generate")
    public Map<String, Object> generate(@RequestBody Map<String, Map<String, List<Subject>>> allDeptsSubjects) {
        return timetableService.generateTimetable(allDeptsSubjects);
    }

    @PostMapping("/generate-strict")
    public Map<String, Object> generateStrict(@RequestBody Map<String, Map<String, List<Subject>>> allDeptsSubjects) {
        return timetableService.generateStrictTimetable(allDeptsSubjects);
    }

    @PostMapping("/archive")
    public ArchivedTimetable archive(@RequestBody ArchivedTimetable archiveData) {
        System.out.println("ARCHIVING INITIATED for Dept: " + archiveData.getDept() + " (Version: " + archiveData.getVersion() + ")");
        try {
            ArchivedTimetable saved = archivedTimetableRepository.save(archiveData);
            System.out.println("ARCHIVING SUCCESSFUL: ID " + saved.getId());
            return saved;
        } catch (Exception e) {
            System.err.println("ARCHIVING FAILED: " + e.getMessage());
            throw e;
        }
    }

    @GetMapping("/archive")
    public List<ArchivedTimetable> getArchives() {
        return archivedTimetableRepository.findAll();
    }

    @GetMapping("/archive/{dept}")
    public List<ArchivedTimetable> getArchivesByDept(@PathVariable String dept) {
        return archivedTimetableRepository.findByDept(dept);
    }

    @DeleteMapping("/archive/{id}")
    public ResponseEntity<Void> deleteArchive(@PathVariable Long id) {
        if (!archivedTimetableRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        archivedTimetableRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
