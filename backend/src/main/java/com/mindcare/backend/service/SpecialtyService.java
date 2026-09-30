package com.mindcare.backend.service;

import com.mindcare.backend.common.ApiException;
import com.mindcare.backend.domain.Specialty;
import com.mindcare.backend.dto.specialty.SpecialtyRequest;
import com.mindcare.backend.repository.SpecialtyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class SpecialtyService {

    private final SpecialtyRepository specialtyRepository;

    public SpecialtyService(SpecialtyRepository specialtyRepository) {
        this.specialtyRepository = specialtyRepository;
    }

    @Transactional(readOnly = true)
    public List<Specialty> findAll() {
        return specialtyRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Specialty findById(UUID id) {
        return specialtyRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Specialty not found: " + id));
    }

    public Specialty create(SpecialtyRequest request) {
        Specialty specialty = new Specialty();
        apply(specialty, request);
        return specialtyRepository.save(specialty);
    }

    public Specialty update(UUID id, SpecialtyRequest request) {
        Specialty specialty = findById(id);
        apply(specialty, request);
        return specialtyRepository.save(specialty);
    }

    public void delete(UUID id) {
        Specialty specialty = findById(id);
        specialtyRepository.delete(specialty);
    }

    private void apply(Specialty specialty, SpecialtyRequest request) {
        specialty.setNameAr(request.nameAr());
        specialty.setNameEn(request.nameEn());
        specialty.setIcon(request.icon());
        specialty.setDescription(request.description());
        specialty.setActive(request.active());
    }
}
