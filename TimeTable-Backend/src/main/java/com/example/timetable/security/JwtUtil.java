package com.example.timetable.security;

import com.example.timetable.model.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    // Ideally, this should be in application.properties. 
    // Using a 256-bit secure key for HMAC-SHA256
    private final String SECRET_KEY_STRING = "SuperSecretTimetableKeyForJwtGenerationDoNotShare123!";
    private final SecretKey key = Keys.hmacShaKeyFor(SECRET_KEY_STRING.getBytes());

    // 24 hours expiration
    private final long JWT_EXPIRATION_MS = 86400000;

    public String generateToken(User user) {
        return Jwts.builder()
                .setSubject(user.getEmail())
                .claim("fullName", user.getFullName())
                .claim("role", user.getRole())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + JWT_EXPIRATION_MS))
                .signWith(key)
                .compact();
    }
}
