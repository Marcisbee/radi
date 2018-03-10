import Component from './ComponentClass';
import ViewParser from './ViewParser';

export default function component(o) {
  return Component.bind(this, o);
}
