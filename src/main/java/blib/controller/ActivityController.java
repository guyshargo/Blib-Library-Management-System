package blib.controller;

import blib.logic.ActivityLogic;
import blib.model.Activity;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import blib.dto.ActivityRequest;
import blib.enums.ActivityType;

import java.time.LocalDateTime;
import java.util.List;

@CrossOrigin
@RestController 
@RequestMapping("/api/activities")
public class ActivityController {

    private final ActivityLogic activityLogic = new ActivityLogic();
    
    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<Activity>> getMemberActivities(@PathVariable int memberId) {
        List<Activity> activityList = activityLogic.fetchAllActivitiesForAMember(memberId);
        return ResponseEntity.ok(activityList);
    }

    @PostMapping("/")
    public ResponseEntity<String> addActivity(@RequestBody ActivityRequest request) {
        try {
            // EchoServer generated the enum and the timestamp right before saving
            ActivityType type = activityLogic.generateActivityType(request.getActivityType());
            Activity activity = new Activity(
                    request.getMemberId(),
                    type,
                    request.getAffectedEntityId(),
                    LocalDateTime.now()
            );

            boolean isAdded = activityLogic.addActivity(activity);
            
            if (isAdded) {
                return ResponseEntity.ok("Activity logged successfully.");
            }
            return ResponseEntity.badRequest().body("Failed to log activity.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.toString());
        }
    }
}
