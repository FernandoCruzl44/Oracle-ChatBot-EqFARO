package com.springboot.MyTodoList.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.MyTodoList.model.Team;
import com.springboot.MyTodoList.model.TeamRole;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.TeamRepository;
import com.springboot.MyTodoList.repository.TeamRoleRepository;
import com.springboot.MyTodoList.repository.UserRepository;
import com.springboot.MyTodoList.service.UserService;

import java.util.HashMap;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

	@Autowired
	private UserService userService;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private TeamRepository teamRepository;

	@Autowired
	private TeamRoleRepository teamRoleRepository;

	@PostMapping
	public User createUser(@RequestBody User user) {
		return userService.createUser(user);
	}

	@GetMapping
	public List<User> getUsers(@RequestParam(defaultValue = "0") int skip,
				   @RequestParam(defaultValue = "10") int limit) {
		return userService.getUsers(skip, limit).getContent();
	}

	@GetMapping("/type/{userType}")
	public List<User> getUsersByType(@PathVariable String userType) {
		return userService.getUsersByUserType(userType);
	}

	@GetMapping("/email/{email}")
	public Optional<User> getUserByEmail(@PathVariable String email) {
		return userService.getUserByEmail(email);
	}

	@GetMapping("/{user_id}")
	public ResponseEntity<User> getUserById(@PathVariable Long user_id) {
		return ResponseEntity.of(userRepository.findById(user_id));
	}

	@PutMapping("/{user_id}")
	public ResponseEntity<User> putUpdateUser(@PathVariable Long user_id, @RequestBody HashMap<String, String> patch) {
		Optional<User> userOpt = userRepository.findById(user_id);
		if (userOpt.isEmpty()) {
			return ResponseEntity.unprocessableEntity().build();
		}

		User userObj = userOpt.get();

		// No fields are assured, so gotta check for all of them
		userObj.setNombre(patch.getOrDefault("nombre", userObj.getNombre()));
		userObj.setEmail(patch.getOrDefault("email", userObj.getEmail()));
		userObj.setChatID(patch.getOrDefault("chatId", userObj.getChatID()));
		userObj.setTelegramID(patch.getOrDefault("telegramId", userObj.getTelegramID()));
		userObj.setPhone(patch.getOrDefault("phone", userObj.getPhone()));
		userObj.setRole(patch.getOrDefault("role", userObj.getRole()));

		return ResponseEntity.ok(userRepository.save(userObj));
	}

	private class UserTeam_PUT {
		public Long team_id;
		public String role;			
	}

	@PutMapping("/{user_id}/team")
	public ResponseEntity<String> addUserToTeam(@PathVariable Long user_id, @RequestBody UserTeam_PUT dataPut) {
		// Validate user_id
		Optional<User> userOptional = userRepository.findById(user_id);
		if (userOptional.isEmpty()) {
			return ResponseEntity.unprocessableEntity()
				.body(Utils.simpleMessageJson("Error", "Could not find user"));
		}

		// Validate the team_id too
		Optional<Team> teamOptional = teamRepository.findById(dataPut.team_id);
		if (teamOptional.isEmpty()) {
			return ResponseEntity.unprocessableEntity()
				.body(Utils.simpleMessageJson("Error", "Could not find team"));
		}

		User userObj = userOptional.get();
		Team teamObj = teamOptional.get();

		boolean hasTeam = teamRoleRepository.findByAssignedUser(userObj).isPresent();

		if (hasTeam) {
			return ResponseEntity.unprocessableEntity()
				.body(Utils.simpleMessageJson("Error",
							      "User %s already in a team!".formatted( userObj.getNombre() )));
		}

		TeamRole newMembership = new TeamRole(); // New relation of user to team
		newMembership.setRoleName(dataPut.role);
		newMembership.setAssignedUser(userObj);
		newMembership.setTeam(teamObj);
		newMembership.setRoleID(null);

		teamRoleRepository.save(newMembership); // Actually saving in database

		return ResponseEntity.ok(Utils.simpleMessageJson("message",
					       "%s assigned to %s as %s".formatted(
						userObj.getNombre(), teamObj.getNombre(), dataPut.role)));
	}

	@DeleteMapping("/{user_id}")
	public ResponseEntity<String> deleteUser(@PathVariable Long user_id) {
		Optional<User> userOpt = userRepository.findById(user_id);
		if (userOpt.isEmpty()) {
			ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(Utils.simpleMessageJson("message", "User deleted"));
	}
}
