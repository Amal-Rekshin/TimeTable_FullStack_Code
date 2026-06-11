package com.example.timetable.repository;

import com.example.timetable.model.ArchivedTimetable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArchivedTimetableRepository extends JpaRepository<ArchivedTimetable, Long> {
    List<ArchivedTimetable> findByDept(String dept);
}
