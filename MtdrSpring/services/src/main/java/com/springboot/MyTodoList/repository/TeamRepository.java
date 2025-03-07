// /src/main/java/com/springboot/MyTodoList/repository/TeamRepository.java
package com.springboot.MyTodoList.repository;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.springboot.MyTodoList.model.Team;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByNameContaining(String namePart);

    List<Team> findAllByOrderByIdAsc(Pageable pageable);
}
