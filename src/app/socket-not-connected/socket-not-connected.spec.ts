import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocketNotConnected } from './socket-not-connected';

describe('SocketNotConnected', () => {
  let component: SocketNotConnected;
  let fixture: ComponentFixture<SocketNotConnected>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocketNotConnected]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SocketNotConnected);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
