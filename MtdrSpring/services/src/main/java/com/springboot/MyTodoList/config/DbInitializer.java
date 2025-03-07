// /src/main/java/com/springboot/MyTodoList/config/DbInitializer.java
package com.springboot.MyTodoList.config;

import javax.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.springboot.MyTodoList.model.Team;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.TeamRepository;
import com.springboot.MyTodoList.repository.UserRepository;

@Component
public class DbInitializer {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;

    @PostConstruct
    public void initializeDatabase() {
        // Solo inicializa si no existen usuarios
        if (userRepository.count() == 0) {
            System.out.println("Initializing database with default users and teams...");

            // Crea equipos
            Team frontendTeam = new Team();
            frontendTeam.setNombre("Equipo Frontend");
            frontendTeam.setDescription("Equipo de desarrollo frontend");
            frontendTeam = teamRepository.save(frontendTeam);

            Team backendTeam = new Team();
            backendTeam.setNombre("Equipo Backend");
            backendTeam.setDescription("Equipo de desarrollo backend");
            backendTeam = teamRepository.save(backendTeam);

            // Crea usuarios
            User managerUser = new User();
            managerUser.setNombre("Manager User");
            managerUser.setEmail("manager@example.com");
            managerUser.setPassword("manager123");
            managerUser.setRole("manager");
            managerUser.setTelegramId("manager_telegram");
            userRepository.save(managerUser);

            User dev1 = new User();
            dev1.setNombre("Dev One");
            dev1.setEmail("dev1@example.com");
            dev1.setPassword("dev123");
            dev1.setRole("developer");
            dev1.setTelegramId("dev1_telegram");
            dev1.setTeam(frontendTeam);
            dev1.setTeamRole("lead");
            userRepository.save(dev1);

            User dev2 = new User();
            dev2.setNombre("Dev Two");
            dev2.setEmail("dev2@example.com");
            dev2.setPassword("dev123");
            dev2.setRole("developer");
            dev2.setTelegramId("dev2_telegram");
            dev2.setTeam(frontendTeam);
            dev2.setTeamRole("member");
            userRepository.save(dev2);

            User dev3 = new User();
            dev3.setNombre("Dev Three");
            dev3.setEmail("dev3@example.com");
            dev3.setPassword("dev123");
            dev3.setRole("developer");
            dev3.setTelegramId("dev3_telegram");
            dev3.setTeam(backendTeam);
            dev3.setTeamRole("lead");
            userRepository.save(dev3);

            User dev4 = new User();
            dev4.setNombre("Dev Four");
            dev4.setEmail("dev4@example.com");
            dev4.setPassword("dev123");
            dev4.setRole("developer");
            dev4.setTelegramId("dev4_telegram");
            dev4.setTeam(backendTeam);
            dev4.setTeamRole("member");
            userRepository.save(dev4);

            System.out.println("Database initialization complete!");
        } else {
            System.out.println("Database already contains users. Skipping initialization.");
        }
    }
}
