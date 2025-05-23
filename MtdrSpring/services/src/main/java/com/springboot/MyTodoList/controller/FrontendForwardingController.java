package com.springboot.MyTodoList.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class FrontendForwardingController {

    // Mappeo para rutas de React Router
    @RequestMapping(value = { "/", "/team", "/productivity", "/error", "/register", "/login" })
    public String forwardSpecific() {
        return "forward:/index.html";
    }
}
