import { Component } from './ComponentClass';
import ViewParser from './ViewParser';

export function component(o) {
  return Component.bind(this, o);
}
