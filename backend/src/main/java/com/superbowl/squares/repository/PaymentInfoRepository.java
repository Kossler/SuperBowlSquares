package com.superbowl.squares.repository;

import com.superbowl.squares.model.PaymentInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentInfoRepository extends JpaRepository<PaymentInfo, Long> {
    List<PaymentInfo> findByUserId(Long userId);
}
