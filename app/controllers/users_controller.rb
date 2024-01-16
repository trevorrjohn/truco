class UsersController < ApplicationController
  def new
    @user = User.new
  end

  def create
    @user = User.new(user_params)
    @user.webauthn_id = WebAuthn.generate_user_id
    if @user.save

      options = WebAuthn::Credential.options_for_create(
        user: { id: user.webauthn_id, name: user.name },
        exclude: user.credentials.map { |c| c.webauthn_id }
      )

      session[:creation_challenge] = options.challenge

      # send email
      redirect_to root_path, notice: "Check your email to complete your sign up"
    else
      render :new, status: :unprocessible_entity
    end
  end
end
