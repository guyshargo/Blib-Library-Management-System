package oak.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import oak.dto.ActivityRequest;
import oak.logic.ActivityLogic;
import oak.model.Activity;

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

    @GetMapping("/librarian/{librarianId}")
    public ResponseEntity<List<Activity>> getLibrarianActivities(@PathVariable int librarianId) {
        List<Activity> activityList = activityLogic.fetchAllActivitiesForLibrarian(librarianId);
        return ResponseEntity.ok(activityList);
    }

    @PostMapping("/")
    public ResponseEntity<String> addActivity(@RequestBody ActivityRequest request) {
        try {
            Activity activity = new Activity(
                    request.getMemberId(),
                    request.getType(),
                    request.getAffectedEntityId(),
                    LocalDateTime.now(),
                    request.getLibrarianId()
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
