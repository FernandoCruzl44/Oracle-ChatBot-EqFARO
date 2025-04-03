package com.springboot.MyTodoList.service;

import io.kubernetes.client.extended.leaderelection.LeaderElectionConfig;
import io.kubernetes.client.extended.leaderelection.LeaderElector;
import io.kubernetes.client.extended.leaderelection.resourcelock.LeaseLock;
import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.util.ClientBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class LeaderElectionService {
    private static final Logger logger = LoggerFactory.getLogger(LeaderElectionService.class);
    private final AtomicBoolean isLeader = new AtomicBoolean(false);
    private final String id = UUID.randomUUID().toString();

    public void startLeaderElection(TelegramBotService telegramBotService) {
        try {
            // Get Kubernetes client
            ApiClient client = ClientBuilder.cluster().build();

            // Create a lock identity unique to this pod
            String lockIdentity = System.getenv().getOrDefault("POD_NAME", "local-" + id);

            // Create a lease lock for leader election
            LeaseLock lock = new LeaseLock(
                    "default", // namespace
                    "telegram-bot-leader", // lease name
                    lockIdentity, // pod identity
                    client);

            // Configure leader election
            LeaderElectionConfig leaderElectionConfig = new LeaderElectionConfig(
                    lock,
                    Duration.ofSeconds(15), // lease duration
                    Duration.ofSeconds(10), // renew deadline
                    Duration.ofSeconds(2)); // retry period

            // Start leader election in a separate thread
            new Thread(() -> {
                try {
                    try (// Create leader elector
                            LeaderElector leaderElector = new LeaderElector(leaderElectionConfig)) {
                        // Register callbacks
                        leaderElector.run(
                                () -> {
                                    logger.info("Pod {} became leader", lockIdentity);
                                    isLeader.set(true);

                                    // Register the Telegram bot when this pod becomes the leader
                                    logger.info("This pod is the leader - registering Telegram bot");
                                    telegramBotService.registerBot();
                                },
                                () -> {
                                    logger.info("Pod {} lost leadership", lockIdentity);
                                    isLeader.set(false);
                                    // Note: We can't unregister the bot easily, so we just log the event
                                    logger.info("Lost leadership - bot will continue running until pod is terminated");
                                });
                    }
                } catch (Exception e) {
                    logger.error("Error in leader election thread", e);
                    // If running locally or outside of K8s, become the leader
                    isLeader.set(true);

                    // Register bot in case of running locally
                    logger.info("Running outside Kubernetes - registering Telegram bot");
                    telegramBotService.registerBot();
                }
            }, "leader-election-thread").start();

        } catch (Exception e) {
            logger.error("Error setting up leader election", e);
            // If running locally or outside of K8s, become the leader
            isLeader.set(true);

            // Register bot in case of running locally
            logger.info("Running outside Kubernetes - registering Telegram bot");
            telegramBotService.registerBot();
        }
    }

    public boolean isLeader() {
        return isLeader.get();
    }
}