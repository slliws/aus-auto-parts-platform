import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types';
import * as quotesService from '../services/quotes.service';
import { logger } from '../utils/logger';
import PDFService from '../services/pdf.service';

/**
 * Quotes controller
 * Handles HTTP requests for quote management
 */

/**
 * Extract IP address from request
 */
const getIpAddress = (req: Request): string | undefined => {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    undefined
  );
};

/**
 * Extract user agent from request
 */
const getUserAgent = (req: Request): string | undefined => {
  return req.headers['user-agent'] || undefined;
};

/**
 * Get all quotes with pagination and filtering
 * @route GET /api/v1/quotes
 */
export const getQuotes = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Parse filters
    const filters: quotesService.QuoteFilters = {};
    if (req.query.search) filters.search = req.query.search as string;
    if (req.query.status) filters.status = req.query.status as any;
    if (req.query.customerId) filters.customerId = req.query.customerId as string;
    if (req.query.userId) filters.userId = req.query.userId as string;
    if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);
    if (req.query.isExpired !== undefined) filters.isExpired = req.query.isExpired === 'true';

    const result = await quotesService.getQuotes(
      tenantId,
      filters,
      { page, limit },
      userId
    );

    const response: ApiResponse = {
      success: true,
      data: result.data,
      meta: result.meta,
    };

    res.status(200).json(response);
  }
);

/**
 * Get single quote by ID
 * @route GET /api/v1/quotes/:id
 */
export const getQuoteById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const quote = await quotesService.getQuoteById(id, tenantId, userId);

    const response: ApiResponse = {
      success: true,
      data: { quote },
    };

    res.status(200).json(response);
  }
);

/**
 * Create new quote
 * @route POST /api/v1/quotes
 */
export const createQuote = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const quoteData: quotesService.CreateQuoteDTO = {
      tenantId,
      customerId: req.body.customerId,
      userId: req.user?.id || userId!, // Use authenticated user ID
      status: req.body.status,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
      notes: req.body.notes,
      terms: req.body.terms,
      quoteItems: req.body.quoteItems,
    };

    const quote = await quotesService.createQuote(
      quoteData,
      userId,
      getIpAddress(req),
      getUserAgent(req)
    );

    const response: ApiResponse = {
      success: true,
      message: 'Quote created successfully',
      data: { quote },
    };

    res.status(201).json(response);
  }
);

/**
 * Update existing quote
 * @route PATCH /api/v1/quotes/:id
 */
export const updateQuote = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const updateData: quotesService.UpdateQuoteDTO = {};
    if (req.body.status) updateData.status = req.body.status;
    if (req.body.expiresAt !== undefined) updateData.expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;
    if (req.body.terms !== undefined) updateData.terms = req.body.terms;
    if (req.body.quoteItems) updateData.quoteItems = req.body.quoteItems;

    const quote = await quotesService.updateQuote(
      id,
      tenantId,
      updateData,
      userId,
      getIpAddress(req),
      getUserAgent(req)
    );

    const response: ApiResponse = {
      success: true,
      message: 'Quote updated successfully',
      data: { quote },
    };

    res.status(200).json(response);
  }
);

/**
 * Send quote
 * @route POST /api/v1/quotes/:id/send
 */
export const sendQuote = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const quote = await quotesService.sendQuote(
      id,
      tenantId,
      userId,
      getIpAddress(req),
      getUserAgent(req)
    );

    const response: ApiResponse = {
      success: true,
      message: 'Quote sent successfully',
      data: { quote },
    };

    res.status(200).json(response);
  }
);

/**
 * Convert quote to order
 * @route POST /api/v1/quotes/:id/convert
 */
export const convertQuote = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const quote = await quotesService.convertQuote(
      id,
      tenantId,
      userId,
      getIpAddress(req),
      getUserAgent(req)
    );

    const response: ApiResponse = {
      success: true,
      message: 'Quote converted to order successfully',
      data: { quote },
    };

    res.status(200).json(response);
  }
);

/**
 * Delete quote (soft delete)
 * @route DELETE /api/v1/quotes/:id
 */
export const deleteQuote = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    await quotesService.deleteQuote(
      id,
      tenantId,
      userId,
      getIpAddress(req),
      getUserAgent(req)
    );

    const response: ApiResponse = {
      success: true,
      message: 'Quote deleted successfully',
    };

    res.status(200).json(response);
  }
);

/**
 * Get quote statistics
 * @route GET /api/v1/quotes/stats
 */
export const getQuoteStats = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const stats = await quotesService.getQuoteStats(tenantId, userId);

    const response: ApiResponse = {
      success: true,
      data: { stats },
    };

    res.status(200).json(response);
  }
);


/**
 * Download quote as PDF
 * @route GET /api/v1/quotes/:id/pdf
 */
export const downloadQuotePDF = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = { success: false, message: 'Tenant context not found' };
      res.status(400).json(response);
      return;
    }

    const quote = await quotesService.getQuoteById(id, tenantId, userId);
    const pdfBuffer = await PDFService.generateQuotePDF(quote);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="quote-${quote.quote_number}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.status(200).end(pdfBuffer);
  }
);

export default {
  getQuotes,
  getQuoteById,
  createQuote,
  updateQuote,
  sendQuote,
  convertQuote,
  deleteQuote,
  getQuoteStats,
  downloadQuotePDF,
};