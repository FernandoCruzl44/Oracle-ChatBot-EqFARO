package com.springboot.MyTodoList.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.UserRepository;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

	@Autowired
	private UserRepository userRepository;

	public User createUser(User user) {
		return userRepository.save(user);
	}

	public List<User> getUsersByUserType(String userType) {
		return userRepository.findByUserType(userType);
	}

	public Optional<User> getUserByEmail(String email) {
		return userRepository.findByEmail(email);
	}
}
