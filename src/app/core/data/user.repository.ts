import { Injectable } from '@angular/core';
import { RepositoryBase } from './repository.base';

@Injectable({ providedIn: 'root' })
export class UserRepository extends RepositoryBase<'users'> {
  constructor() {
    super('users');
  }

  async byCredentials(username: string, password: string) {
    const all = await this.getAll();
    return all.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password && u.active
    );
  }
}
