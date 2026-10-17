package oak.enums;

public enum FreezeStatus {
    FROZEN("FROZEN"), 
    NOT_FROZEN("NOT_FROZEN");

    private final String dbValue;

    FreezeStatus(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() { return dbValue; }

    public static FreezeStatus fromDbValue(String dbValue) {
        for (FreezeStatus status : FreezeStatus.values()) {
            if (status.dbValue.equalsIgnoreCase(dbValue)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown database value for FreezeStatus: " + dbValue);
    }
}