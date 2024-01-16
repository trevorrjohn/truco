class User < ApplicationRecord
  validates :email, uniqueness: true
  encrypts :email, deterministic: true, downcase: true

  validates :name, presence: true
end
