package oak.enums;

public enum ReportType {
    MEMBER_STATUS_REPORT("memberStatusReport"), 
    BORROW_REPORT("borrowReport"),
    STATUS_TRACKING("statusTracking"),
    BORROW_TRACKING("borrowTracking");

    private final String value;

    ReportType(String value) {
        this.value = value;
    }

    public String getValue() { return value; }

    @Override
    public String toString() { return value; }

    public static ReportType fromValue(String value) {
        for (ReportType type : ReportType.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown report type: " + value);
    }
}