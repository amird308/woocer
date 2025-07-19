import { makePaginationList } from './pagination';
import { PaginationResponse } from '../types/pagination.response';

interface MockItem {
  id: number;
  name: string;
}

describe('makePaginationList', () => {
  describe('Basic functionality', () => {
    it('should create pagination response with default values', () => {
      // Arrange
      const mockPayload: MockItem[] = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];
      const expectedResponse: PaginationResponse<MockItem> = {
        data: mockPayload,
        currentPage: 1,
        totalPages: 1,
        take: 10,
        offset: 0,
        total: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };

      // Act
      const actualResponse = makePaginationList({ payload: mockPayload });

      // Assert
      expect(actualResponse).toEqual(expectedResponse);
    });

    it('should create pagination response with provided values', () => {
      // Arrange
      const mockPayload: MockItem[] = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ];
      const inputTotal = 25;
      const inputPage = 1;
      const inputTake = 5;
      const expectedResponse: PaginationResponse<MockItem> = {
        data: mockPayload,
        currentPage: 2,
        totalPages: 5,
        take: 5,
        offset: 5,
        total: 25,
        hasNextPage: true,
        hasPrevPage: true,
      };

      // Act
      const actualResponse = makePaginationList({
        payload: mockPayload,
        total: inputTotal,
        page: inputPage,
        take: inputTake,
      });

      // Assert
      expect(actualResponse).toEqual(expectedResponse);
    });
  });

  describe('Pagination calculations', () => {
    it('should calculate totalPages correctly when total is divisible by take', () => {
      // Arrange
      const mockPayload: MockItem[] = [];
      const inputTotal = 20;
      const inputTake = 5;
      const expectedTotalPages = 4;

      // Act
      const actualResponse = makePaginationList({
        payload: mockPayload,
        total: inputTotal,
        take: inputTake,
      });

      // Assert
      expect(actualResponse.totalPages).toBe(expectedTotalPages);
    });

    it('should calculate totalPages correctly when total is not divisible by take', () => {
      // Arrange
      const mockPayload: MockItem[] = [];
      const inputTotal = 23;
      const inputTake = 5;
      const expectedTotalPages = 5;

      // Act
      const actualResponse = makePaginationList({
        payload: mockPayload,
        total: inputTotal,
        take: inputTake,
      });

      // Assert
      expect(actualResponse.totalPages).toBe(expectedTotalPages);
    });

    it('should calculate offset correctly', () => {
      // Arrange
      const mockPayload: MockItem[] = [];
      const inputPage = 3;
      const inputTake = 10;
      const expectedOffset = 30;

      // Act
      const actualResponse = makePaginationList({
        payload: mockPayload,
        page: inputPage,
        take: inputTake,
      });

      // Assert
      expect(actualResponse.offset).toBe(expectedOffset);
    });

    it('should convert zero-based page to one-based currentPage', () => {
      // Arrange
      const mockPayload: MockItem[] = [];
      const inputPage = 0;
      const expectedCurrentPage = 1;

      // Act
      const actualResponse = makePaginationList({
        payload: mockPayload,
        page: inputPage,
      });

      // Assert
      expect(actualResponse.currentPage).toBe(expectedCurrentPage);
    });
  });

  describe('hasNextPage logic', () => {
    it('should return true when there are more pages after current', () => {
      // Arrange
      const mockPayload: MockItem[] = [];
      const inputTotal = 25;
      const inputPage = 1;
      const inputTake = 10;

      // Act
      const actualResponse = makePaginationList({
        payload: mockPayload,
        total: inputTotal,
        page: inputPage,
        take: inputTake,
      });

      // Assert
      expect(actualResponse.hasNextPage).toBe(true);
    });

    it('should return false when on last page', () => {
      // Arrange
      const mockPayload: MockItem[] = [];
      const inputTotal = 25;
      const inputPage = 2;
      const inputTake = 10;

      // Act
      const actualResponse = makePaginationList({
        payload: mockPayload,
        total: inputTotal,
        page: inputPage,
        take: inputTake,
      });

      // Assert
      expect(actualResponse.hasNextPage).toBe(false);
    });

    it('should return false when total is zero', () => {
      // Arrange
      const mockPayload: MockItem[] = [];
      const inputTotal = 0;
      const inputPage = 0;
      const inputTake = 10;

      // Act
      const actualResponse = makePaginationList({
        payload: mockPayload,
        total: inputTotal,
        page: inputPage,
        take: inputTake,
      });

      // Assert
      expect(actualResponse.hasNextPage).toBe(false);
    });
  });

  describe('hasPrevPage logic', () => {
    it('should return false when on first page', () => {
      // Arrange
      const mockPayload: MockItem[] = [];
      const inputPage = 0;

      // Act
      const actualResponse = makePaginationList({
        payload: mockPayload,
        page: inputPage,
      });

      // Assert
      expect(actualResponse.hasPrevPage).toBe(false);
    });

    it('should return true when not on first page', () => {
      // Arrange
      const mockPayload: MockItem[] = [];
      const inputPage = 1;

      // Act
      const actualResponse = makePaginationList({
        payload: mockPayload,
        page: inputPage,
      });

      // Assert
      expect(actualResponse.hasPrevPage).toBe(true);
    });

    it('should return true for high page numbers', () => {
      // Arrange
      const mockPayload: MockItem[] = [];
      const inputPage = 5;

      // Act
      const actualResponse = makePaginationList({
        payload: mockPayload,
        page: inputPage,
      });

      // Assert
      expect(actualResponse.hasPrevPage).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty payload array', () => {
      // Arrange
      const mockPayload: MockItem[] = [];
      const expectedResponse: PaginationResponse<MockItem> = {
        data: [],
        currentPage: 1,
        totalPages: 0,
        take: 10,
        offset: 0,
        total: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };

      // Act
      const actualResponse = makePaginationList({ payload: mockPayload });

      // Assert
      expect(actualResponse).toEqual(expectedResponse);
    });

    it('should handle total of 1 with take of 1', () => {
      // Arrange
      const mockPayload: MockItem[] = [{ id: 1, name: 'Single Item' }];
      const inputTotal = 1;
      const inputTake = 1;
      const expectedResponse: PaginationResponse<MockItem> = {
        data: mockPayload,
        currentPage: 1,
        totalPages: 1,
        take: 1,
        offset: 0,
        total: 1,
        hasNextPage: false,
        hasPrevPage: false,
      };

      // Act
      const actualResponse = makePaginationList({
        payload: mockPayload,
        total: inputTotal,
        take: inputTake,
      });

      // Assert
      expect(actualResponse).toEqual(expectedResponse);
    });

    it('should handle large numbers', () => {
      // Arrange
      const mockPayload: MockItem[] = [];
      const inputTotal = 1000000;
      const inputPage = 999;
      const inputTake = 100;

      // Act
      const actualResponse = makePaginationList({
        payload: mockPayload,
        total: inputTotal,
        page: inputPage,
        take: inputTake,
      });

      // Assert
      expect(actualResponse.currentPage).toBe(1000);
      expect(actualResponse.totalPages).toBe(10000);
      expect(actualResponse.offset).toBe(99900);
      expect(actualResponse.hasNextPage).toBe(true);
      expect(actualResponse.hasPrevPage).toBe(true);
    });

    it('should handle zero total with positive page', () => {
      // Arrange
      const mockPayload: MockItem[] = [];
      const inputTotal = 0;
      const inputPage = 5;
      const inputTake = 10;

      // Act
      const actualResponse = makePaginationList({
        payload: mockPayload,
        total: inputTotal,
        page: inputPage,
        take: inputTake,
      });

      // Assert
      expect(actualResponse.totalPages).toBe(0);
      expect(actualResponse.hasNextPage).toBe(false);
      expect(actualResponse.hasPrevPage).toBe(true);
    });
  });

  describe('Different payload types', () => {
    it('should work with string payload', () => {
      // Arrange
      const mockPayload: string[] = ['item1', 'item2', 'item3'];
      const inputTotal = 10;
      const inputPage = 1;
      const inputTake = 5;

      // Act
      const actualResponse = makePaginationList({
        payload: mockPayload,
        total: inputTotal,
        page: inputPage,
        take: inputTake,
      });

      // Assert
      expect(actualResponse.data).toEqual(mockPayload);
      expect(actualResponse.currentPage).toBe(2);
      expect(actualResponse.totalPages).toBe(2);
    });

    it('should work with number payload', () => {
      // Arrange
      const mockPayload: number[] = [1, 2, 3, 4, 5];
      const inputTotal = 15;
      const inputPage = 0;
      const inputTake = 5;

      // Act
      const actualResponse = makePaginationList({
        payload: mockPayload,
        total: inputTotal,
        page: inputPage,
        take: inputTake,
      });

      // Assert
      expect(actualResponse.data).toEqual(mockPayload);
      expect(actualResponse.currentPage).toBe(1);
      expect(actualResponse.totalPages).toBe(3);
    });

    it('should work with complex object payload', () => {
      // Arrange
      interface ComplexItem {
        id: number;
        user: {
          name: string;
          email: string;
        };
        metadata: Record<string, unknown>;
      }
      const mockPayload: ComplexItem[] = [
        {
          id: 1,
          user: { name: 'John', email: 'john@example.com' },
          metadata: { active: true },
        },
      ];

      // Act
      const actualResponse = makePaginationList({ payload: mockPayload });

      // Assert
      expect(actualResponse.data).toEqual(mockPayload);
      expect(actualResponse.data[0].user.name).toBe('John');
    });
  });
});
