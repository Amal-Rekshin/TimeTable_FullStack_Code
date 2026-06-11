package com.example.timetable.controller;

import com.example.timetable.model.Department;
import com.example.timetable.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentRepository departmentRepository;

    @GetMapping
    public List<Department> getAll() {
        return departmentRepository.findAll();
    }

    @PostMapping
    public Department create(@RequestBody Department department) {
        return departmentRepository.save(department);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Department> update(@PathVariable Long id, @RequestBody Department department) {
        return departmentRepository.findById(id)
                .map(existing -> {
                    existing.setName(department.getName());
                    existing.setSemesters(department.getSemesters());
                    existing.setSections(department.getSections());
                    existing.setStudents(department.getStudents());
                    return ResponseEntity.ok(departmentRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!departmentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        departmentRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
