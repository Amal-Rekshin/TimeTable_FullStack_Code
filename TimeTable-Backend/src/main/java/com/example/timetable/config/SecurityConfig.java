package com.example.timetable.config;

import com.example.timetable.security.OAuth2LoginSuccessHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) 
            // Disable CSRF for simple testing (should be enabled in production)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/**", "/", "/error").permitAll() 
                // Keep existing endpoints public
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth -> oauth
                .successHandler(oAuth2LoginSuccessHandler)
            );

        return http.build();
    }
}
