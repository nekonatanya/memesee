package com.memesee.content.notification.infrastructure;

import com.memesee.content.notification.domain.ContentNotification;
import com.memesee.content.notification.domain.NotificationType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ContentNotificationRepository
        extends JpaRepository<ContentNotification, Long>, JpaSpecificationExecutor<ContentNotification> {

    long countByUsernameAndReadAtIsNull(String username);

    List<ContentNotification> findAllByUsername(String username);

    Optional<ContentNotification> findByIdAndUsername(Long id, String username);

    boolean existsByUsernameAndTypeAndActorUsernameAndMainPostIdAndSubPostId(
            String username,
            NotificationType type,
            String actorUsername,
            Long mainPostId,
            Long subPostId
    );

    boolean existsByUsernameAndTypeAndActorUsernameAndMainPostIdAndSubPostIdIsNull(
            String username,
            NotificationType type,
            String actorUsername,
            Long mainPostId
    );
}
