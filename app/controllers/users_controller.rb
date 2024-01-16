class UsersController < ApplicationController
  def new
    @user = User.new
  end

  def create
    @user = User.new(user_params)
    if @user.save
      # send email
      redirect_to root_path, notice: "Check your email to complete your sign up"
    else
      render :new, status: :unprocessible_entity
    end
  end
end
