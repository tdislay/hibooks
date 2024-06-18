import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

export function needAuthenticated(
  request: Request,
  _response: Response,
  next: NextFunction
): void {
  if (request.session === null) {
    throw new UnauthorizedException();
  }

  next();
}

export function needUnauthenticated(
  request: Request,
  _response: Response,
  next: NextFunction
): void {
  if (request.session !== null) {
    throw new ForbiddenException();
  }

  next();
}
