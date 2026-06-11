package com.example.timetable.security;

import com.example.timetable.model.User;
import com.example.timetable.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        
        // Find user by email or create a new one
        Optional<User> userOpt = userRepository.findByEmail(email);
        User user;
        
        if (userOpt.isPresent()) {
            user = userOpt.get();
        } else {
            user = new User();
            user.setEmail(email);
            user.setFullName(name);
            user.setRole("staff"); // Default role
            user.setPassword(UUID.randomUUID().toString()); // Secure random password since it's required by DB
            user = userRepository.save(user);
        }
        
        // 🔥 Generate JWT instead of sending user data
        String token = jwtUtil.generateToken(user);
        
        // Redirect to frontend React app callback URL
        String redirectUrl = "https://sprightly-taffy-950990.netlify.app/auth/callback?token=" + token;
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
