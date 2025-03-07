package com.springboot.MyTodoList.controller;

public final class Utils {
	public static String simpleMessageJson(String first, String second) {
		return "{ \"%s\": \"%s\" }".formatted(first, second);
	}
}
