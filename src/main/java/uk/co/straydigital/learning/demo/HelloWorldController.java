package uk.co.straydigital.learning.demo;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("hello-world")
public class HelloWorldController {

    @GetMapping
    public String get() {
        return "Hello World!";
    }

    @GetMapping(value = "/name/{name}")
    public String getWithName(@PathVariable("name") String name) {
        return String.format("Hello %s", name);
    }
}
