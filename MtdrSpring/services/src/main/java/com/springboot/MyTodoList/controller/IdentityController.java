package com.springboot.MyTodoList.controller;

import java.util.HashMap;
import java.util.Optional;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.UserRepository;
import com.springboot.MyTodoList.service.UserService;

@RestController
@RequestMapping("/api/identity")
public class IdentityController {

	@Autowired
	private UserService userService;

	@Autowired
	private UserRepository userRepo;


	@PostMapping("/set/{userID}")
	public ResponseEntity<String> setIdentity(HttpServletResponse response,
						@PathVariable Long userID) {
		Optional<User> user = userRepo.findById(userID);

		if (user.isPresent()) {
			User userObj = user.get();
			Cookie cookie = new Cookie("user_id", Long.toString(userObj.getId()));
			cookie.setMaxAge(86400);
			response.addCookie(cookie);

			return ResponseEntity.ok(Utils.simpleMessageJson(userObj.getNombre(), userObj.getRole()));
		}

		return ResponseEntity.notFound().build();
	}

	@GetMapping("/current")
	public ResponseEntity<User> getCurrentIdentity(@CookieValue(value = "user_id") Long userID) {
		Optional<User> user = userRepo.findById(userID);

		return ResponseEntity.of(user);
	}

	@PostMapping("/clear")
	public String clearIdentity(HttpServletResponse response) {
		Cookie cookie = new Cookie("user_id", "");
		cookie.setMaxAge(0);

		return Utils.simpleMessageJson("message", "Identity cleared");
	}
}
