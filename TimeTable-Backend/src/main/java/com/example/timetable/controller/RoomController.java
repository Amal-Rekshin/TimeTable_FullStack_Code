package com.example.timetable.controller;

import com.example.timetable.model.Room;
import com.example.timetable.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomRepository roomRepository;

    @GetMapping
    public List<Room> getAll() {
        return roomRepository.findAll();
    }

    @PostMapping
    public Room create(@RequestBody Room room) {
        return roomRepository.save(room);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Room> update(@PathVariable Long id, @RequestBody Room room) {
        return roomRepository.findById(id)
                .map(existing -> {
                    existing.setName(room.getName());
                    existing.setCapacity(room.getCapacity());
                    existing.setBenches(room.getBenches());
                    existing.setType(room.getType());
                    existing.setBlock(room.getBlock());
                    existing.setFloor(room.getFloor());
                    existing.setStatus(room.getStatus());
                    existing.setMaintenanceDate(room.getMaintenanceDate());
                    existing.setAmenities(room.getAmenities());
                    return ResponseEntity.ok(roomRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!roomRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        roomRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
