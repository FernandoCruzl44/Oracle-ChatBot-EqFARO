// /src/main/java/com/springboot/MyTodoList/controller/SpaForwardingController.java
package com.springboot.MyTodoList.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaForwardingController {

    // Mappeo para rutas de React Router
    @RequestMapping(value = { "/", "/team", "/productivity", "/error" })
    public String forwardSpecific() {
        return "forward:/index.html";
    }
}
