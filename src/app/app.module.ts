import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { UsersModule } from './users/users.module';
import { AppConfigService } from './core/app-config.service';
import { AppRoutingModule } from './app-routing.module';
import { ProductsModule } from './products/products.module';
import { NotesModule } from './notes/notes.module';
import { AuthModule } from './auth/auth.module';
import { AuthTokenInterceptor } from './core/auth-token.interceptor';

export function initConfig(cfg: AppConfigService) {
  return () => cfg.load();
}


@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    UsersModule,
    ProductsModule,
    NotesModule,
    AuthModule,
    AppRoutingModule
  ],
  providers: [
    { provide: APP_INITIALIZER, useFactory: initConfig, deps: [AppConfigService], multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthTokenInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
