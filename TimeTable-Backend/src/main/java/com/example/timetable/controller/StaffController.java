package com.example.timetable.controller;

import com.example.timetable.model.Staff;
import com.example.timetable.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffController {

    private final StaffRepository staffRepository;

    @GetMapping
    public List<Staff> getAll() {
        return staffRepository.findAll();
    }

    @PostMapping
    public Staff create(@RequestBody Staff staff) {
        return staffRepository.save(staff);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Staff> update(@PathVariable Long id, @RequestBody Staff staff) {
        return staffRepository.findById(id)
                .map(existing -> {
                    existing.setName(staff.getName());
                    existing.setCode(staff.getCode());
                    existing.setDesignation(staff.getDesignation());
                    existing.setDept(staff.getDept());
                    existing.setMaxHours(staff.getMaxHours());
                    existing.setHandleLabs(staff.getHandleLabs());
                    existing.setEligibleSubjects(staff.getEligibleSubjects());
                    return ResponseEntity.ok(staffRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!staffRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        staffRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
