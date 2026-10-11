package blib.model;

import java.io.Serializable;
import com.fasterxml.jackson.annotation.JsonProperty;
import blib.enums.IsOrdered;

public class Book implements Serializable {
    private static final long serialVersionUID = 1L;
    private String title;
    private String author;
    private String genre;
    private int copiesNum;
    private int borrowedCopiesNum;
    private String keywords;
    private IsOrdered isOrdered;
    private int bookId;
    private int ordersNum;
    private String summary;

    public Book(String title, String author, String genre, int copiesNum, int borrowedCopiesNum, String keywords,
                IsOrdered isOrdered, int bookId, int ordersNum) {
        this.title = title;
        this.author = author;
        this.genre = genre;
        this.copiesNum = copiesNum;
        this.borrowedCopiesNum = borrowedCopiesNum;
        this.keywords = keywords;
        this.isOrdered = isOrdered;
        this.bookId = bookId;
        this.ordersNum = ordersNum;
    }

    @JsonProperty("title")
    public String getBookTitle() { return this.title; }
    public void setBookTitle(String title) { this.title = title; }

    @JsonProperty("author")
    public String getAuthor() { return this.author; }
    public void setAuthor(String author) { this.author = author; }
    
    @JsonProperty("genre")
    public String getBookGenre() { return this.genre; }
    public void setBookGenre(String genre) { this.genre = genre; }

    @JsonProperty("copiesNum")
    public int getNumberOfCopies() { return this.copiesNum; }
    public void setNumberOfCopies(int copiesNum) { this.copiesNum = copiesNum; }

    @JsonProperty("borrowedCopiesNum")
    public int getNumberOfBorrowedCopies() { return this.borrowedCopiesNum; }
    public void setNumberOfBorrowedCopies(int borrowedCopiesNum) { this.borrowedCopiesNum = borrowedCopiesNum; }

    @JsonProperty("keywords")
    public String getKeywords() { return this.keywords; }
    public void setKeywords(String keywords) { this.keywords = keywords; }

    @JsonProperty("isOrdered")
    public IsOrdered getIsOrdered() { return this.isOrdered; }
    public void setIsOrdered(IsOrdered isOrdered) { this.isOrdered = isOrdered; }
    public boolean getIsOrderedBoolean() { return this.isOrdered.getValue(); }
    
    @JsonProperty("bookId")
    public int getBookId() { return this.bookId; }
    public void setBookId(int bookId) { this.bookId = bookId; }

    @JsonProperty("ordersNum")
    public int getNumberOforders() { return this.ordersNum; }
    public void setNumberOforders(int ordersNum) { this.ordersNum = ordersNum; }

    @JsonProperty("summary")
    public String getBookSummary() { return this.summary; }
    public void setBookSummary(String summary) { this.summary = summary; }
    
    public String toString() { return "(Book) " + this.title + " (author: " + this.author + ", genre: " + this.genre + ", copies: " + this.copiesNum + ", borrowed: " + this.borrowedCopiesNum + ", keywords: " + this.keywords + ", ordered?: " + this.isOrdered + ", id: " + this.bookId + ", orders: " + this.ordersNum + ", Summary: " + this.summary + ")\n"; }
}