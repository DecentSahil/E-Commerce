package com.example.user.event;

public interface UserEventConsumer {

    
    void handleUserRegistered(UserRegisteredEvent event);
}
