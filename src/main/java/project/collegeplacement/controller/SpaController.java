package project.collegeplacement.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping({
            "/student",
            "/student/{path:[^\\.]*}",
            "/admin",
            "/admin/{path:[^\\.]*}"
    })
    public String forwardReactRoutes() {
        return "forward:/index.html";
    }
}
