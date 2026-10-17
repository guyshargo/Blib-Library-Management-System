package oak.model;

import java.io.Serializable;
import com.fasterxml.jackson.annotation.JsonProperty;

import oak.enums.IsOrdered;

public class Book implements Serializable {
    private static final long serialVersionUID = 1L;
    private String title;
    private String author;
    private String genre;
    private int copiesNum;
    private int borrowedNum;
    private String keywords;
    private IsOrdered isOrdered;
    private int bookId;
    private int ordersNum;
    private String summary;
    private String characters;
    private int pages;
    private double orderPrice;
    private double rating;

    public Book(String title, String author, String genre, int copiesNum, int borrowedNum, String keywords,
                IsOrdered isOrdered, int bookId, int ordersNum) {
        this.title = title;
        this.author = author;
        this.genre = genre;
        this.copiesNum = copiesNum;
        this.borrowedNum = borrowedNum;
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

    @JsonProperty("borrowedNum")
    public int getNumberOfBorrowedCopies() { return this.borrowedNum; }
    public void setNumberOfBorrowedCopies(int borrowedNum) { this.borrowedNum = borrowedNum; }

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

    @JsonProperty("characters")
    public String getCharacters() { return this.characters; }
    public void setCharacters(String characters) { this.characters = characters; }

    @JsonProperty("pages")
    public int getPages() { return this.pages; }
    public void setPages(int pages) { this.pages = pages; }

    @JsonProperty("orderPrice")
    public double getOrderPrice() { return this.orderPrice; }
    public void setOrderPrice(double orderPrice) { this.orderPrice = orderPrice; }

    @JsonProperty("rating")
    public double getRating() { return this.rating; }
    public void setRating(double rating) { this.rating = rating; }
    
    public String toString() { return "(Book) " + this.title + " (author: " + this.author + ", genre: " + this.genre + ", copies: " + this.copiesNum + ", borrowed: " + this.borrowedNum + ", keywords: " + this.keywords + ", ordered?: " + this.isOrdered + ", id: " + this.bookId + ", orders: " + this.ordersNum + ", Summary: " + this.summary + ")\n"; }
}