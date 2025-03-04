package com.springboot.MyTodoList.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaForwardingController {

    // Explicit mapping for SPA routes
    @RequestMapping(value = { "/", "/team", "/productivity", "/error" })
    public String forwardSpecific() {
        return "forward:/index.html";
    }
}
